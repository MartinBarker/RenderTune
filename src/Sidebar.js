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
    position: 'fixed',
    zIndex: 1,
    overflow: 'hidden'
  };

  const buttonStyle = {
    display: 'block',
    margin: '10px',
    color: 'white',
    background: 'none',
    border: 'none',
    cursor: 'pointer'
  };

  const circleButtonStyle = {
    position: 'absolute',
    top: '20px',
    right: isExpanded ? '200px' : '50px',
    borderRadius: '50%',
    border: 'none',
    width: '50px',
    height: '50px',
    cursor: 'pointer',
    backgroundColor: '#555',
    transition: 'right 0.3s'
  };

  return (
    <div style={sidebarStyle}>
      <button style={circleButtonStyle} onClick={toggleSidebar}>
        {isExpanded ? '<' : '>'}
      </button>
      <button style={buttonStyle}>
        <i className="icon1"></i>{isExpanded && ' Button 1'}
      </button>
      <button style={buttonStyle}>
        <i className="icon2"></i>{isExpanded && ' Button 2'}
      </button>
      <button style={buttonStyle}>
        <i className="icon3"></i>{isExpanded && ' Button 3'}
      </button>
      <button style={buttonStyle}>
        <i className="icon4"></i>{isExpanded && ' Button 4'}
      </button>
    </div>
  );
}

export default Sidebar;
