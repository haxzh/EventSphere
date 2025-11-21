import Developers from "@/components/Landing_Page_partials/Developers";
import FeaturesZigZag from "@/components/Landing_Page_partials/FeaturesZigZag";
import Header from "@/components/Landing_Page_partials/Header";
import HeroHome from "@/components/Landing_Page_partials/HeroHome";
import LandingPageDevelopers from "@/utils/landing_page_developers";
import React from "react";
import { useEffect } from "react";

const [feature1, feature2, feature3, dev1, dev2, dev3, pm1] = LandingPageDevelopers;

function LandingPage() {

    // run the server when a user enters the site
    const fetchAllEvents = async () => {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        try {
            const response = await fetch(`${apiBase}/getallevents`);
            if (!response.ok) {
                console.warn("fetch /getallevents returned", response.status, response.statusText);
                return; // fail gracefully on client
            }
        } catch (err) {
            // Network error (server down / CORS / DNS) — avoid unhandled runtime error
            console.warn("fetch /getallevents failed:", err.message || err);
            return;
        }
    };

    useEffect(() => {
        fetchAllEvents();
    }, []);

    return (
        <div className="overflow-x-hidden">
            <div className="flex flex-col min-h-screen overflow-x-hidden ">
                <Header className="overflow-x-hidden" />

                <main className="grow">
                    <HeroHome />
                    <FeaturesZigZag images={[feature1, feature2, feature3]} />
                    <Developers images={[dev1, dev2, dev3, pm1]} />
                </main>
            </div>
        </div>
    );
}

export default LandingPage;
