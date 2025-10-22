import { useState, useEffect } from 'react';
import PetService from '../services/petService';

export const usePets = (params = {}) => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const response = await PetService.getPets(params);
        setPets(response.data.pets || response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();
  }, [JSON.stringify(params)]);

  return { pets, loading, error };
};

export const usePet = (petId) => {
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!petId) return;

    const fetchPet = async () => {
      try {
        setLoading(true);
        const response = await PetService.getPetById(petId);
        setPet(response.data.pet || response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [petId]);

  return { pet, loading, error };
};

export const useOwnedPets = () => {
  const [ownedPets, setOwnedPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOwnedPets = async () => {
      try {
        setLoading(true);
        const response = await PetService.getOwnedPets();
        setOwnedPets(response.data.pets || response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOwnedPets();
  }, []);

  return { ownedPets, loading, error };
};

export const usePetActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPet = async (petData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await PetService.createPet(petData);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePet = async (petId, petData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await PetService.updatePet(petId, petData);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePet = async (petId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await PetService.deletePet(petId);
      return response.data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createPet,
    updatePet,
    deletePet,
    loading,
    error
  };
};