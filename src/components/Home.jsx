import { Link } from "react-router-dom";
export default function Home() {
    return (
        <>
            <div className="flex w-full p-40">
                <div className="card  bg-base-300 rounded-box grid  grow place-items-center">
                    Калкулатор за балове
                    <div className="hover-3d">
                        {/* content */}
                        <figure className="max-w-100 rounded-4xl">
                            <Link to="/calculator">

                            <img
                                src="/calculator.png"
                                alt="calculator 3D card"
                            />
                            </Link>
                        </figure>
                        {/* 8 empty divs needed for the 3D effect */}
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
                <div className="divider divider-horizontal"></div>
                <div className="card bg-base-300 rounded-box grid  grow place-items-center">
                    Търсачка за университети
                    <div className="hover-3d">
                        {/* content */}
                        <figure className="max-w-100 rounded-4xl">
                            <Link to="/universities">
                                <img src="/search.png" alt="search 3D card" />
                            </Link>
                        </figure>
                        {/* 8 empty divs needed for the 3D effect */}
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                        <div></div>
                    </div>
                </div>
            </div>
        </>
    );
}
