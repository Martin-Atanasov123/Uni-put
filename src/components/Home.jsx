export default function Home() {
    return (
        <>
            <div className="flex w-full p-40">
                <div className="card  bg-base-300 rounded-box grid  grow place-items-center">
                    Калкулатор за балове
                    <div className="hover-3d">
                        {/* content */}
                        <figure className="max-w-100 rounded-2xl">
                            <img
                                src="/Gemini_Generated_Image_ovf8o6ovf8o6ovf8.png"
                                alt="3D card"
                            />
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
                <div className="divider divider-horizontal">OR</div>
                <div className="card bg-base-300 rounded-box grid  grow place-items-center">
                    Търсачка за университети
                    <div className="hover-3d">
                        {/* content */}
                        <figure className="max-w-100 rounded-2xl">
                            <img
                                src="/Gemini_Generated_Image_ovf8o6ovf8o6ovf8.png"
                                alt="3D card"
                            />
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
