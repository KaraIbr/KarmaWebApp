// Cat.jsx
import React from 'react';

const Cat = ({ errorCode }) => {
  return (
    <div style={{ textAlign: 'center' }}>
      <h1>Error {errorCode}</h1>
      <img src={`https://http.cat/${errorCode}`} alt={`Error ${errorCode}`} />
    </div>
  );
};

export default Cat;
