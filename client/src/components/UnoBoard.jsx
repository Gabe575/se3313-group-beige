import { useEffect } from "react";
import { useNavigate } from "react-router";
import { useParams } from "react-router-dom";

let navigate = useNavigate();


export default function UnoBoard({ gameInfo }) {

    const { gameId } = useParams();

    useEffect(() => {


        // If invalid gameInfo, send them back to the lobby
        if (gameInfo.currentPlayers.length != 4) navigate(`/lobby/${gameId}`)



    })




}