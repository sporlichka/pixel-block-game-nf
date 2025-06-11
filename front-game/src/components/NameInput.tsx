import { useState } from "react";

interface NameInputProps {
  onSubmit: (name: string) => void;
}

export function NameInput({ onSubmit }: NameInputProps) {
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  return (
    <div className="name-input-container">
      <h2>Enter Your Name</h2>
      <form onSubmit={handleSubmit} className="name-input-form">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          maxLength={20}
          className="name-input"
          autoFocus
        />
        <button type="submit" className="name-submit-btn">
          Play!
        </button>
      </form>
    </div>
  );
}
