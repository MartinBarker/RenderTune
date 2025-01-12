import React, { useState } from 'react';

function FFmpegConfigForm({ onSubmit }) {
    const [configs, setConfigs] = useState({
        // ...existing code...
        paddingColor: '#FFFFFF', // Rename and change default color
        stretchImageToFit: false,
        // ...existing code...
    });

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setConfigs({
            ...configs,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(configs);
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* ...existing code... */}
            <div>
                <label>
                    Stretch Image to Fit:
                    <input
                        type="checkbox"
                        name="stretchImageToFit"
                        checked={configs.stretchImageToFit}
                        onChange={handleInputChange}
                    />
                </label>
            </div>
            <div>
                <label>
                    Padding Color:
                    <input
                        type="text"
                        name="paddingColor"
                        value={configs.paddingColor}
                        onChange={handleInputChange}
                        disabled={configs.stretchImageToFit} // Disable when stretchImageToFit is checked
                    />
                </label>
            </div>
            {/* ...existing code... */}
        </form>
    );
}

export default FFmpegConfigForm;
