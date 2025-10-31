import { useState, useEffect } from 'react';

interface UseCitizenSyncReturn {
  isDataSync: boolean;
  isSyncModalOpen: boolean;
  isUnsyncModalOpen: boolean;
  openSyncModal: () => void;
  closeSyncModal: () => void;
  openUnsyncModal: () => void;
  closeUnsyncModal: () => void;
  handleSyncSuccess: () => void;
  handleUnsyncSuccess: () => void;
  handleSyncError: (error: string) => void;
  handleUnsyncError: (error: string) => void;
  refreshSyncStatus: () => void;
}

export const useCitizenSync = (): UseCitizenSyncReturn => {
  const [isDataSync, setIsDataSync] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isUnsyncModalOpen, setIsUnsyncModalOpen] = useState(false);

  // Initialize sync status from localStorage
  useEffect(() => {
    refreshSyncStatus();
  }, []);

  const refreshSyncStatus = () => {
    const syncStatus = localStorage.getItem("is_online_data_sync") === "true";
    setIsDataSync(syncStatus);
  };

  const openSyncModal = () => {
    setIsSyncModalOpen(true);
  };

  const closeSyncModal = () => {
    setIsSyncModalOpen(false);
  };

  const openUnsyncModal = () => {
    setIsUnsyncModalOpen(true);
  };

  const closeUnsyncModal = () => {
    setIsUnsyncModalOpen(false);
  };

  const handleSyncSuccess = () => {
    refreshSyncStatus();
    // You can add additional success handling here
    console.log('Citizen ID sync successful');
  };

  const handleUnsyncSuccess = () => {
    refreshSyncStatus();
    // You can add additional success handling here
    console.log('Citizen ID unsync successful');
  };

  const handleSyncError = (error: string) => {
    // You can add error handling logic here
    console.error('Citizen ID sync error:', error);
  };

  const handleUnsyncError = (error: string) => {
    // You can add error handling logic here
    console.error('Citizen ID unsync error:', error);
  };

  return {
    isDataSync,
    isSyncModalOpen,
    isUnsyncModalOpen,
    openSyncModal,
    closeSyncModal,
    openUnsyncModal,
    closeUnsyncModal,
    handleSyncSuccess,
    handleUnsyncSuccess,
    handleSyncError,
    handleUnsyncError,
    refreshSyncStatus,
  };
};