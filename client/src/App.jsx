import { useState } from 'react'
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from './components/MainMenu';
import GameList from './components/GameList';
import CreateGame from './components/CreateGame';
import Lobby from './components/Lobby';
import NotFound from './components/NotFound';
import { WebSocketProvider } from './components/WebSocketProvider';


const Root = styled.div`
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background: radial-gradient(#3d50ba, #161d3f);
`;

export default function App() {
    return (
        <WebSocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path='/game-list' element={<GameList />} />
                    <Route path='/create-game' element={<CreateGame />} />
                    <Route path='/game/:gameId' element={<GameList />} />
                    <Route path='/lobby/:gameId' element={<Lobby />} />
                    

                    
                    <Route path='/*' element={<NotFound />} />
                </Routes>
            </Router>
        </WebSocketProvider>
    )
}