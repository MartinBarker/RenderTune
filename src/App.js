import React from 'react';
import Frame from './Frame'
import Upload from './Upload'

function App() {
  return (
    <>
      <Frame/>
      <div style={{"marginTop":"40px"}}>
        <Upload/>
      </div>
    </>
  );
}
export default App;
