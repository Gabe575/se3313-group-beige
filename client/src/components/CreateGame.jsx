import { useNavigate } from "react-router";
import { useEffect, useState } from "react";

import { API_URL } from '../util/config';

export default function () {

    // Redirect back to main menu if no name
    let navigate = useNavigate();
    if (localStorage.getItem('name') == null) navigate('/');
    
    
    
    // TODO: function to send post request to backend to create game + game thread etc
    function sendCreateRequest() {
        console.log('Creating game....');
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 p-4">
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                <h2 className="text-center text-lg font-bold text-black">Create Game</h2>
                
                <button
                    className="w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700"
                    onClick={() => navigate('/')}
                >
                    Back
                </button>
            </div>
        </div>
    )


}