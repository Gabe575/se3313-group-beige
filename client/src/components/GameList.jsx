import { useNavigate } from "react-router";



export default function () {

    // Redirect back to main menu if no name
    let navigate = useNavigate();
    if (localStorage.getItem('name') == null) navigate('/');


    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-red-600 p-4">
            <div className="w-80 bg-white p-6 rounded-2xl shadow-lg flex flex-col gap-4">

                <button
                    className={`w-full bg-yellow-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-yellow-700`}
                    onClick={() => navigate('/')}>
                    Back
                </button>

            </div>

        </div>
    )


}