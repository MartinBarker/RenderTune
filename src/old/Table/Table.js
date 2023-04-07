import React, { useState } from 'react';
import './Table.css'

const data = [
  { id: 1, title: 'Song 1', artist: 'Artist 1', album: 'Album 1' },
  { id: 2, title: 'Song 2', artist: 'Artist 2', album: 'Album 2' },
  { id: 3, title: 'Song 3', artist: 'Artist 3', album: 'Album 3' },
  { id: 4, title: 'Song 4', artist: 'Artist 4', album: 'Album 4' },
  { id: 5, title: 'Song 5', artist: 'Artist 5', album: 'Album 5' },
];

const Table = () => {
  const [songs, setSongs] = useState(data);
  const [selectedSongs, setSelectedSongs] = useState([]);

  const handleDrag = (event, index) => {
    event.dataTransfer.setData('text/plain', index);
  };

  const handleDrop = (event, index) => {
    const draggingIndex = event.dataTransfer.getData('text/plain');
    const draggingSong = songs[draggingIndex];
    const newSongs = songs.filter((song, i) => i !== draggingIndex);
    newSongs.splice(index, 0, draggingSong);
    setSongs(newSongs);
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelectedSongs(songs);
    } else {
      setSelectedSongs([]);
    }
  };

  const handleSelect = (event, song) => {
    if (event.target.checked) {
      setSelectedSongs([...selectedSongs, song]);
    } else {
      setSelectedSongs(selectedSongs.filter((selectedSong) => selectedSong.id !== song.id));
    }
  };

  const handleSort = (sortBy) => {
    const newSongs = [...songs];
    newSongs.sort((a, b) => {
      if (a[sortBy] < b[sortBy]) return -1;
      if (a[sortBy] > b[sortBy]) return 1;
      return 0;
    });
    setSongs(newSongs);
  };

  return (
    <table>
      <thead>
        <tr>
          <th>
            <input type="checkbox" onChange={handleSelectAll} />
          </th>
          <th onClick={() => handleSort('title')}>
            Title
          </th>
          <th onClick={() => handleSort('artist')}>
            Artist
          </th>
          <th onClick={() => handleSort('album')}>
            Album
          </th>
        </tr>
      </thead>
      <tbody>
        {songs.map((song, index) => (
          <tr
            key={song.id}
            draggable
            onDragStart={(event) => handleDrag(event, index)}
            onDrop={(event) => handleDrop(event, index)}
          >
            <td>
              <input
                type="checkbox"
                checked={selectedSongs.some((selectedSong) => selectedSong.id === song.id)}
                onChange={(event) => handleSelect(event, song)}
              />
            </td>
            <td>
              {song.title}
            </td>
            <td>
              {song.artist}
            </td>
            <td>
              {song.album}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default Table;