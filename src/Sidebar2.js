import React, { useState } from 'react';

function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const sidebarStyle = {
    width: isExpanded ? '200px' : '50px',
    height: '100vh',
    backgroundColor: '#333',
    color: 'white',
    transition: 'width 0.3s',
    padding: isExpanded ? '10px' : '5px',
    textAlign: 'center'
  };

  return (
    <div style={sidebarStyle}>
      <button onClick={toggleSidebar}>
        {isExpanded ? '<' : '>'}
      </button>
      {isExpanded && <div>Expanded Content</div>}
    </div>
  );
}

export default Sidebar;
