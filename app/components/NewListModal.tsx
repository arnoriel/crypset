// components/NewListModal.tsx
import React, { useState } from "react";

interface NewListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (name: string) => void;
}

export default function NewListModal({ isOpen, onClose, onCreate }: NewListModalProps) {
  const [name, setName] = useState("");

  const handleSubmit = () => {
    if (name.trim()) {
      onCreate(name.trim());
      setName("");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-sm">
        <h2 className="text-xl mb-4">New Portfolio List</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="My Crypto Portfolio"
          className="w-full bg-gray-700 px-3 py-2 rounded mb-4"
          autoFocus
        />
        <div className="flex gap-3">
          <button onClick={handleSubmit} className="bg-blue-600 px-4 py-2 rounded hover:bg-blue-700">
            Create
          </button>
          <button onClick={onClose} className="bg-gray-600 px-4 py-2 rounded">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}