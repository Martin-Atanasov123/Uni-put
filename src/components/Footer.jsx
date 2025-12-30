import React from "react";

const Footer = () => {
    return (
        <footer className="footer  bg-base-200 text-base-content mt-20 footer-center pm:footer-horizontal  p-20">
            <aside>
                <span className="text-5xl">🎓</span>
                <p className="font-bold">
                    UniPut Bulgaria 
                    <br />
                    <span className="font-normal opacity-70">
                        Иновации в кандидатстудентския прием от 2025
                    </span>
                </p>
            </aside>
            <nav>
                <h6 className="footer-title">Ресурси</h6>
                <a className="link link-hover">Списък матури</a>
                <a className="link link-hover">Справочник 2024</a>
                <a className="link link-hover">МОН Новини</a>
            </nav>
            <nav>
                <h6 className="footer-title">Проектът</h6>
                <a className="link link-hover">За нас</a>
                <a className="link link-hover">Лиценз (MIT)</a>
                <a className="link link-hover">GitHub</a>
            </nav>
            <nav>
                <h6 className="footer-title">Правна информация</h6>
                <a className="link link-hover">Условия за ползване</a>
                <a className="link link-hover">Политика за поверителност</a>
            </nav>
        </footer>
    );
};

export default Footer;
