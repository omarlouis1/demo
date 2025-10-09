import React, { useState, useEffect } from 'react';
import { smartphoneAPI } from './services/api';
import SmartphoneList from './components/SmartphoneList';
import SmartphoneForm from './components/SmartphoneForm';
import SearchBar from './components/SearchBar';
import './styles/App.css';

function App() {
  const [smartphones, setSmartphones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingSmartphone, setEditingSmartphone] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Charger les smartphones
  const loadSmartphones = async (search = '') => {
    try {
      setLoading(true);
      setError('');
      const params = search ? { marque: search } : {};
      const response = await smartphoneAPI.getAll(params);
      setSmartphones(response.data.smartphones);
    } catch (err) {
      setError('Erreur lors du chargement des smartphones');
      console.error('Error loading smartphones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSmartphones();
  }, []);

  // Gérer la recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      loadSmartphones(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Ajouter ou modifier un smartphone
  const handleSubmit = async (smartphoneData) => {
    try {
      setError('');
      setSuccess('');

      if (editingSmartphone) {
        // Modification
        await smartphoneAPI.update(editingSmartphone._id, smartphoneData);
        setSuccess('Smartphone modifié avec succès');
      } else {
        // Ajout
        await smartphoneAPI.create(smartphoneData);
        setSuccess('Smartphone ajouté avec succès');
      }

      setShowForm(false);
      setEditingSmartphone(null);
      loadSmartphones(searchTerm);
    } catch (err) {
      setError('Erreur lors de la sauvegarde du smartphone');
      console.error('Error saving smartphone:', err);
    }
  };

  // Supprimer un smartphone
  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce smartphone ?')) {
      try {
        setError('');
        await smartphoneAPI.delete(id);
        setSuccess('Smartphone supprimé avec succès');
        loadSmartphones(searchTerm);
      } catch (err) {
        setError('Erreur lors de la suppression du smartphone');
        console.error('Error deleting smartphone:', err);
      }
    }
  };

  // Ouvrir le formulaire d'ajout
  const handleAddNew = () => {
    setEditingSmartphone(null);
    setShowForm(true);
  };

  // Ouvrir le formulaire de modification
  const handleEdit = (smartphone) => {
    setEditingSmartphone(smartphone);
    setShowForm(true);
  };

  // Fermer le formulaire
  const handleCancel = () => {
    setShowForm(false);
    setEditingSmartphone(null);
  };

  return (
    <div className="App">
      <header className="header">
        <div className="container">
          <h1>📱 Gestion des Smartphones</h1>
          <p>Application de gestion de votre inventaire de smartphones</p>
        </div>
      </header>

      <div className="container">
        {error && <div className="error">{error}</div>}
        {success && <div className="success">{success}</div>}

        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddNew={handleAddNew}
        />

        <SmartphoneList
          smartphones={smartphones}
          onEdit={handleEdit}
          onDelete={handleDelete}
          loading={loading}
        />

        {showForm && (
          <SmartphoneForm
            smartphone={editingSmartphone}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        )}
      </div>
    </div>
  );
}

export default App;
