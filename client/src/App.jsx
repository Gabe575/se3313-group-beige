import { useState } from 'react'
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from './components/MainMenu';
import GameList from './components/GameList';
import CreateGame from './components/CreateGame';




const Root = styled.div`
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: radial-gradient(#3d50ba, #161d3f);
`;

function App() {

    return (
        <Root>
            <Router>
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path='/game-list' element={<GameList />} />
                    <Route path='/create-game' element={<CreateGame />} />
                    <Route path='/game' element={<GameList />} />
                    
                </Routes>
            </Router>
        </Root>
    )
}

export default App


/*
<Route path="/lobby" element={<MainMenu />} />
<Route path="/game" element={<Game />} />
*/