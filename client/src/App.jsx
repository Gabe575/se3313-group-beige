import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainMenu from './components/MainMenu';
import GameList from './components/GameList';
import CreateGame from './components/CreateGame';
import Lobby from './components/Lobby';
import NotFound from './components/NotFound';
import { WebSocketProvider } from './components/WebSocketProvider';
import Game from "./components/Game";
import WebSocketTester from "./components/WebSocketTester";

export default function App() {
    return (
        <WebSocketProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<MainMenu />} />
                    <Route path='/game-list' element={<GameList />} />
                    <Route path='/create-game' element={<CreateGame />} />
                    <Route path='/game/:gameId' element={<Game />} />
                    <Route path='/lobby/:gameId' element={<Lobby />} />
                    
                    <Route path='/tester' element={<WebSocketTester />} />
                    
                    <Route path='/*' element={<NotFound />} />
                </Routes>
            </Router>
        </WebSocketProvider>
    )
}