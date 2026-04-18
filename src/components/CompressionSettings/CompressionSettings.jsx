import React from 'react';

const CompressionSettings = ({ settings = {}, onSettingsChange }) => {
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    onSettingsChange({
      ...settings,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  return (
    <div className='compress-level'>
      <label className="settings-field">
        <span>Compression level</span>
        <select 
          name="level" 
          value={settings.level || 'medium'} 
          onChange={handleChange}
        >
          <option value="low">Low compression, better quality</option>
          <option value="medium">Balanced compression</option>
          <option value="high">Strong compression, smaller files</option>
        </select>
      </label>
      <label className="settings-check">
        <input
          type="checkbox"
          name="preserveQuality"
          checked={settings.preserveQuality || false}
          onChange={handleChange}
        />
        <span>Bias toward visual quality</span>
      </label>
    </div>
  );
};

export default CompressionSettings;
