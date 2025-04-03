// ConfirmDialog.tsx
import React from 'react';

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-auto">
        <h3 className="text-xl sm:text-2xl font-semibold mb-4">Confirmación</h3>
        <p className="text-gray-700 text-sm sm:text-base mb-6">{message}</p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-4">
          <button
            onClick={onConfirm}
            className="w-full sm:w-auto px-4 py-2 bg-green-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Sí
          </button>
          <button
            onClick={onCancel}
            className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded hover:bg-gray-300 transition-colors"
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};
