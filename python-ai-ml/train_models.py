"""
=============================================================================
  PetConnect Adoption AI — Complete Model Training Script
=============================================================================
  Trains 3 ML models using data/custom_adoption_dataset.csv (875 India records)

  Models saved as .pkl (joblib) — correct format for XGBoost / sklearn / scipy.
  (.h5 is for Keras/TensorFlow neural nets only — NOT used here)

  Models produced:
    models/adoption_xgboost_model.pkl   — XGBoost success predictor
    models/adoption_scaler.pkl          — Feature scaler (XGBoost)
    models/adoption_encoders.pkl        — Label encoders (XGBoost)
    models/adoption_kmeans_model.pkl    — KMeans pet clusterer
    models/adoption_kmeans_scaler.pkl   — Feature scaler (KMeans)
    models/adoption_svd_model.pkl       — SVD collaborative filter

  Usage:
    python train_models.py              # train all 3 models
    python train_models.py --model xgb  # train only XGBoost
    python train_models.py --model kmeans
    python train_models.py --model svd

=============================================================================
"""

import os, sys, argparse, importlib.util, time, json
import numpy as np

# ─── paths ────────────────────────────────────────────────────────────────────
BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
CSV_PATH  = os.path.join(BASE_DIR, 'data', 'custom_adoption_dataset.csv')
MODEL_DIR = os.path.join(BASE_DIR, 'models')
os.makedirs(MODEL_DIR, exist_ok=True)

# ─── direct module loader (bypasses __init__.py → avoids TF/Keras dependency) ─
def _load_module(name, rel_path):
    abs_path = os.path.join(BASE_DIR, 'modules', 'adoption', rel_path)
    spec = importlib.util.spec_from_file_location(name, abs_path)
    mod  = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod

# ─── colour helpers ───────────────────────────────────────────────────────────
GREEN  = '\033[92m'
YELLOW = '\033[93m'
RED    = '\033[91m'
CYAN   = '\033[96m'
BOLD   = '\033[1m'
RESET  = '\033[0m'


def banner(text):
    print(f"\n{BOLD}{CYAN}{'='*64}{RESET}")
    print(f"{BOLD}{CYAN}  {text}{RESET}")
    print(f"{BOLD}{CYAN}{'='*64}{RESET}")


def ok(text):   print(f"  {GREEN}[OK]  {text}{RESET}")
def warn(text): print(f"  {YELLOW}[!!]  {text}{RESET}")
def fail(text): print(f"  {RED}[ERR] {text}{RESET}")
def info(text): print(f"  {CYAN}[>>]  {text}{RESET}")


# ─── 0.  Load custom CSV ──────────────────────────────────────────────────────
def load_csv_data():
    banner("Step 0 — Loading Custom Adoption Dataset")
    if not os.path.exists(CSV_PATH):
        fail(f"CSV not found: {CSV_PATH}")
        fail("Run  python generate_custom_dataset.py  first")
        sys.exit(1)

    loader_mod = _load_module('custom_data_loader', 'custom_data_loader.py')
    loader     = loader_mod.CustomDataLoader(CSV_PATH)

    xgb_records   = loader.get_xgboost_records()   # 2 625 records
    kmeans_pets   = loader.get_kmeans_pets()         # 875 pets
    svd_interacts = _generate_svd_interactions()     # 400 synthetic interactions

    ok(f"XGBoost  records : {len(xgb_records):,}")
    ok(f"KMeans   pets    : {len(kmeans_pets):,}")
    ok(f"SVD  interactions: {len(svd_interacts):,}")
    info("Dataset: 875 India-focused records × 3 user archetypes (no random synthetic)")
    return xgb_records, kmeans_pets, svd_interacts


# ─── SVD synthetic interaction generator (pure, no module import needed) ──────
def _generate_svd_interactions(n_users=25, n_pets=50, n_interactions=400):
    """
    Build a realistic user-pet rating matrix for SVD training.
    Uses 8 real user archetypes × random pets, ratings driven by compatibility.
    """
    import random
    from datetime import datetime, timedelta

    USER_ARCHETYPES = [
        {'id': 'active_family',      'activityLevel': 4, 'hasChildren': True,  'homeType': 'house'},
        {'id': 'single_apartment',   'activityLevel': 2, 'hasChildren': False, 'homeType': 'apartment'},
        {'id': 'retired_couple',     'activityLevel': 2, 'hasChildren': False, 'homeType': 'house'},
        {'id': 'young_professional', 'activityLevel': 3, 'hasChildren': False, 'homeType': 'apartment'},
        {'id': 'outdoor_person',     'activityLevel': 5, 'hasChildren': False, 'homeType': 'house'},
        {'id': 'family_kids',        'activityLevel': 3, 'hasChildren': True,  'homeType': 'house'},
        {'id': 'elderly_single',     'activityLevel': 1, 'hasChildren': False, 'homeType': 'apartment'},
        {'id': 'first_time_owner',   'activityLevel': 3, 'hasChildren': False, 'homeType': 'house'},
    ]

    ENERGY_LEVELS = [1, 2, 3, 4, 5]

    def compat_rating(user, pet_energy):
        base = 2.5
        diff = abs(user['activityLevel'] - pet_energy)
        base += [1.0, 0.5, 0.0, -0.5, -0.8][diff] if diff <= 4 else -0.8
        return round(max(0.5, min(5.0, base + random.uniform(-0.4, 0.4))), 1)

    random.seed(42)
    interactions, seen = [], set()
    user_ids = [f"arch_{a['id']}_{i:02d}" for i in range(n_users // len(USER_ARCHETYPES) + 1)
                for a in USER_ARCHETYPES][:n_users]
    pet_ids  = [f"csv_pet_{i:03d}" for i in range(n_pets)]
    archetype_map = {uid: USER_ARCHETYPES[i % len(USER_ARCHETYPES)] for i, uid in enumerate(user_ids)}
    pet_energy    = {pid: random.choice(ENERGY_LEVELS) for pid in pet_ids}

    attempts = 0
    while len(interactions) < n_interactions and attempts < n_interactions * 10:
        attempts += 1
        uid = random.choice(user_ids)
        pid = random.choice(pet_ids)
        if (uid, pid) in seen:
            continue
        seen.add((uid, pid))
        rating = compat_rating(archetype_map[uid], pet_energy[pid])
        itype  = ('adopted' if rating >= 4.5 else
                  'applied' if rating >= 3.5 else
                  'favorited' if rating >= 2.5 else 'viewed')
        interactions.append({
            'userId': uid, 'petId': pid,
            'interactionType': itype, 'implicitRating': rating,
            'timestamp': (datetime.now() - timedelta(days=random.randint(1, 180))).isoformat()
        })
    return interactions


# ─── 1.  Train XGBoost ────────────────────────────────────────────────────────
def train_xgboost(xgb_records):
    banner("Step 1 — XGBoost Success Predictor (Classification)")
    info("Algorithm : Gradient Boosted Trees")
    info(f"n_estimators : 100  (≈ epochs for XGBoost)")
    info(f"Training on  : {len(xgb_records):,} user-pet records")
    info("Output label : success (1) / fail (0)")

    # Change dir so model_path resolves correctly
    prev_dir = os.getcwd()
    os.chdir(BASE_DIR)

    try:
        sp_mod = _load_module('success_predictor', 'success_predictor.py')
        predictor = sp_mod.SuccessPredictor()
        predictor.trained = False  # force retrain

        t0 = time.time()
        metrics = predictor.train(xgb_records)
        elapsed = time.time() - t0

        ok(f"Training complete in {elapsed:.1f}s")
        ok(f"Accuracy      : {metrics.get('accuracy', 0):.1f}%")
        ok(f"Precision     : {metrics.get('precision', 0):.1f}%")
        ok(f"Recall        : {metrics.get('recall', 0):.1f}%")
        ok(f"F1-score      : {metrics.get('f1Score', 0):.1f}%")
        ok(f"AUC-ROC       : {metrics.get('aucRoc', 0):.3f}")
        ok(f"CV Accuracy   : {metrics.get('cvMean', 0):.1f}% ± {metrics.get('cvStd', 0):.1f}%")
        ok(f"Train samples : {metrics.get('trainingDataCount', 0):,}")
        ok(f"Test samples  : {metrics.get('testDataCount', 0):,}")

        # Top features (from model attribute)
        fi = getattr(predictor, 'feature_importance', [])[:5]
        if fi:
            info("Top 5 features:")
            for f in fi:
                print(f"      {f['rank']}. {f['feature']}  ({f['importance']:.3f})")

        ok(f"Saved → models/adoption_xgboost_model.pkl")
        ok(f"Saved → models/adoption_scaler.pkl")
        ok(f"Saved → models/adoption_encoders.pkl")
        return metrics

    except Exception as e:
        fail(f"XGBoost training failed: {e}")
        import traceback; traceback.print_exc()
        return {}
    finally:
        os.chdir(prev_dir)


# ─── 2.  Train KMeans ─────────────────────────────────────────────────────────
def train_kmeans(kmeans_pets):
    banner("Step 2 — KMeans Pet Clustering (Unsupervised)")
    info("Algorithm : K-Means++ (auto-select k via Elbow + Silhouette)")
    info(f"Training on : {len(kmeans_pets):,} pet profiles")
    info("Output      : cluster_id + personality label per pet")

    prev_dir = os.getcwd()
    os.chdir(BASE_DIR)

    try:
        pc_mod   = _load_module('pet_clustering', 'pet_clustering.py')
        clusterer = pc_mod.PetClusterer()
        clusterer.trained = False

        t0 = time.time()
        metrics = clusterer.train(kmeans_pets)
        elapsed = time.time() - t0

        ok(f"Training complete in {elapsed:.1f}s")
        ok(f"Optimal k     : {metrics.get('optimal_k', '?')} clusters")
        ok(f"Silhouette    : {metrics.get('silhouette_score', 0):.3f}  (higher = better, max 1.0)")
        ok(f"Inertia       : {metrics.get('inertia', 0):.1f}")
        ok(f"Pets clustered: {metrics.get('total_pets', 0):,}")

        # Cluster names from model attribute
        labels = getattr(clusterer, 'cluster_names', {})
        sizes  = metrics.get('cluster_sizes', {})
        if labels:
            info("Cluster personality labels:")
            for cid, label in labels.items():
                sz = sizes.get(label, '?')
                print(f"      Cluster {cid}: {label}  ({sz} pets)")

        ok(f"Saved → models/adoption_kmeans_model.pkl")
        ok(f"Saved → models/adoption_kmeans_scaler.pkl")
        return metrics

    except Exception as e:
        fail(f"KMeans training failed: {e}")
        import traceback; traceback.print_exc()
        return {}
    finally:
        os.chdir(prev_dir)


# ─── 3.  Train SVD ────────────────────────────────────────────────────────────
def train_svd(svd_interactions):
    banner("Step 3 — SVD Collaborative Filter (Matrix Factorization)")
    info("Algorithm   : Truncated SVD (scipy) — same math as Netflix prize")
    info(f"n_factors   : 20  (latent dimensions)")
    info(f"Training on : {len(svd_interactions):,} user-pet interactions")
    info("Output      : predicted rating for any (user, pet) pair")

    prev_dir = os.getcwd()
    os.chdir(BASE_DIR)

    try:
        cf_mod = _load_module('collaborative_filter', 'collaborative_filter.py')
        cf     = cf_mod.CollaborativeFilter(n_factors=20)
        cf.trained = False

        t0 = time.time()
        metrics = cf.train(svd_interactions)
        elapsed = time.time() - t0

        ok(f"Training complete in {elapsed:.1f}s")
        ok(f"RMSE          : {metrics.get('rmse', 0):.3f}  (lower = better)")
        ok(f"MAE           : {metrics.get('mae', 0):.3f}")
        ok(f"Accuracy      : {metrics.get('accuracy', 0):.1f}%")
        ok(f"Users modelled: {len(getattr(cf, 'user_index', {}))}")
        ok(f"Pets modelled : {len(getattr(cf, 'pet_index', {}))}")
        ok(f"Interactions  : {metrics.get('training_samples', 0):,}")
        ok(f"Latent factors: {metrics.get('n_factors', 20)}")
        ok(f"Explained var : {metrics.get('explained_variance_ratio', 0):.4f}")

        ok(f"Saved → models/adoption_svd_model.pkl")
        return metrics

    except Exception as e:
        fail(f"SVD training failed: {e}")
        import traceback; traceback.print_exc()
        return {}
    finally:
        os.chdir(prev_dir)


# ─── 4.  Summary ──────────────────────────────────────────────────────────────
def print_summary(xgb_m, km_m, svd_m):
    banner("Training Complete — Summary")

    rows = [
        ("XGBoost (Success Predictor)", "models/adoption_xgboost_model.pkl",
         f"Acc {xgb_m.get('accuracy',0):.1f}%  AUC {xgb_m.get('aucRoc',0):.3f}",
         bool(xgb_m)),
        ("KMeans  (Pet Clusterer)",     "models/adoption_kmeans_model.pkl",
         f"k={km_m.get('optimal_k','?')}  Silhouette {km_m.get('silhouette_score',0):.3f}",
         bool(km_m)),
        ("SVD     (Collaborative)",     "models/adoption_svd_model.pkl",
         f"RMSE {svd_m.get('rmse',0):.3f}  MAE {svd_m.get('mae',0):.3f}",
         bool(svd_m)),
    ]

    for name, path, metric, success in rows:
        icon  = f"{GREEN}[OK]{RESET}" if success else f"{RED}[!!]{RESET}"
        print(f"  {icon}  {BOLD}{name}{RESET}")
        print(f"       File   : {path}")
        print(f"       Metric : {metric}\n")

    print(f"{CYAN}{'─'*64}{RESET}")
    print(f"  Model format : {BOLD}.pkl{RESET} (joblib)  ← correct for XGBoost/sklearn/scipy")
    print(f"  (.h5 is only for Keras/TensorFlow neural nets — not used here)")
    print(f"\n  {BOLD}How models are used in your project:{RESET}")
    print(f"    1. Flask starts  → bootstrap_training.py loads these .pkl files")
    print(f"    2. Node.js calls  POST /api/adoption/ml/recommend/hybrid")
    print(f"    3. Flask combines XGBoost + KMeans + SVD + content score")
    print(f"    4. Returns ranked pet list with match scores to the frontend")
    print(f"\n  {BOLD}To retrain:{RESET}  python train_models.py")
    print(f"  {BOLD}To run service:{RESET} python app.py   (auto-loads .pkl on startup)")
    print(f"{CYAN}{'─'*64}{RESET}\n")


# ─── CLI ──────────────────────────────────────────────────────────────────────
def main():
    parser = argparse.ArgumentParser(description='Train PetConnect adoption ML models')
    parser.add_argument('--model', choices=['xgb', 'kmeans', 'svd', 'all'], default='all',
                        help="Which model to train (default: all)")
    args = parser.parse_args()

    banner("PetConnect — Adoption AI Training")
    info(f"CSV   : {CSV_PATH}")
    info(f"Models: {MODEL_DIR}")

    xgb_records, kmeans_pets, svd_interactions = load_csv_data()

    xgb_m = km_m = svd_m = {}

    if args.model in ('xgb', 'all'):
        xgb_m = train_xgboost(xgb_records)

    if args.model in ('kmeans', 'all'):
        km_m = train_kmeans(kmeans_pets)

    if args.model in ('svd', 'all'):
        svd_m = train_svd(svd_interactions)

    print_summary(xgb_m, km_m, svd_m)


if __name__ == '__main__':
    main()
