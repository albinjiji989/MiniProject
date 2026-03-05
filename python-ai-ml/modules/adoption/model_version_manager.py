"""
Model Version Manager

Handles model versioning, backup, and rollback for all 3 ML models.
Before each retrain, the current models are backed up with a version tag.
If the new model is worse, we can roll back.

Model files:
  models/adoption_svd_model.pkl
  models/adoption_xgboost_model.pkl  + adoption_scaler.pkl
  models/adoption_kmeans_model.pkl   + adoption_kmeans_scaler.pkl

Backup directory:
  models/backups/v{N}/   (keeps last MAX_BACKUPS versions)
"""

import os
import shutil
import json
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

MODELS_DIR = 'models'
BACKUP_DIR = os.path.join(MODELS_DIR, 'backups')
MAX_BACKUPS = 5  # Keep last 5 versions

# All adoption model files (path relative to MODELS_DIR)
MODEL_FILES = [
    'adoption_svd_model.pkl',
    'adoption_xgboost_model.pkl',
    'adoption_scaler.pkl',
    'adoption_encoders.pkl',
    'adoption_kmeans_model.pkl',
    'adoption_kmeans_scaler.pkl',
]


def _get_version_dirs():
    """Get list of existing backup version directories, sorted by version number."""
    if not os.path.exists(BACKUP_DIR):
        return []
    dirs = []
    for d in os.listdir(BACKUP_DIR):
        if d.startswith('v') and os.path.isdir(os.path.join(BACKUP_DIR, d)):
            try:
                version = int(d[1:])
                dirs.append((version, d))
            except ValueError:
                continue
    dirs.sort(key=lambda x: x[0])
    return dirs


def _next_version():
    """Get next version number."""
    dirs = _get_version_dirs()
    if not dirs:
        return 1
    return dirs[-1][0] + 1


def backup_current_models(reason=''):
    """
    Backup current model files before retrain.
    
    Args:
        reason: Why this backup was created (e.g., 'before_retrain_r25')
    
    Returns:
        dict with version info, or None if no models to back up
    """
    try:
        # Check if any model files exist
        existing_files = []
        for f in MODEL_FILES:
            path = os.path.join(MODELS_DIR, f)
            if os.path.exists(path):
                existing_files.append(f)
        
        if not existing_files:
            logger.info("No existing models to backup")
            return None
        
        version = _next_version()
        version_dir = os.path.join(BACKUP_DIR, f'v{version}')
        os.makedirs(version_dir, exist_ok=True)
        
        # Copy model files
        for f in existing_files:
            src = os.path.join(MODELS_DIR, f)
            dst = os.path.join(version_dir, f)
            shutil.copy2(src, dst)
        
        # Save metadata
        metadata = {
            'version': version,
            'timestamp': datetime.now().isoformat(),
            'reason': reason,
            'files': existing_files,
            'file_sizes': {f: os.path.getsize(os.path.join(MODELS_DIR, f)) for f in existing_files}
        }
        with open(os.path.join(version_dir, 'metadata.json'), 'w') as mf:
            json.dump(metadata, mf, indent=2)
        
        logger.info(f"📦 Models backed up to v{version} ({len(existing_files)} files, reason: {reason})")
        
        # Prune old backups
        _prune_old_backups()
        
        return metadata
        
    except Exception as e:
        logger.error(f"Failed to backup models: {e}")
        return None


def rollback_to_version(version=None):
    """
    Rollback to a specific version, or the latest backup.
    
    Args:
        version: Version number to rollback to (None = latest)
    
    Returns:
        dict with rollback info, or None on failure
    """
    try:
        dirs = _get_version_dirs()
        if not dirs:
            logger.warning("No backups available for rollback")
            return None
        
        if version is None:
            # Latest backup
            version = dirs[-1][0]
        
        version_dir = os.path.join(BACKUP_DIR, f'v{version}')
        if not os.path.exists(version_dir):
            logger.error(f"Backup v{version} not found")
            return None
        
        # Load metadata
        meta_path = os.path.join(version_dir, 'metadata.json')
        metadata = {}
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as mf:
                metadata = json.load(mf)
        
        # Restore files
        restored = []
        for f in MODEL_FILES:
            src = os.path.join(version_dir, f)
            dst = os.path.join(MODELS_DIR, f)
            if os.path.exists(src):
                shutil.copy2(src, dst)
                restored.append(f)
        
        logger.info(f"🔄 Rolled back to v{version} ({len(restored)} files restored)")
        
        return {
            'version': version,
            'restored_files': restored,
            'original_metadata': metadata
        }
        
    except Exception as e:
        logger.error(f"Rollback failed: {e}")
        return None


def get_backup_info():
    """Get information about all available backups."""
    dirs = _get_version_dirs()
    backups = []
    
    for ver, dirname in dirs:
        version_dir = os.path.join(BACKUP_DIR, dirname)
        meta_path = os.path.join(version_dir, 'metadata.json')
        
        metadata = {'version': ver}
        if os.path.exists(meta_path):
            with open(meta_path, 'r') as mf:
                metadata = json.load(mf)
        
        backups.append(metadata)
    
    return backups


def _prune_old_backups():
    """Remove oldest backups beyond MAX_BACKUPS."""
    dirs = _get_version_dirs()
    while len(dirs) > MAX_BACKUPS:
        old_version, old_dir = dirs.pop(0)
        old_path = os.path.join(BACKUP_DIR, old_dir)
        try:
            shutil.rmtree(old_path)
            logger.info(f"🗑️ Pruned old backup v{old_version}")
        except Exception as e:
            logger.warning(f"Failed to prune v{old_version}: {e}")
