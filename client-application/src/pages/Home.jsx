import { Link } from "react-router-dom";
import './Home.css';

export default function HomePage() {
    return (
        <body style={{backgroundColor: "#bd4c44"}}>
            <div>
                <h1 style={{paddingBottom: "2vw", textAlign: "center"}}>Home Page</h1>
                <div style={{textAlign: "center", alignItems: "center", 
                    backgroundColor: "#6F263D", width: "100%", 
                    padding: "5vw", borderRadius: "100%"}}>
                    <img src="src/assets/QLD_reds_logo.svg.png" alt="Red's Logo"
                    style={{height: "22vw", width: "25vw", textAlign: "center"}}/>
                </div>
                <div style={{marginTop: "5vw", marginBottom: "5vw"}}>
                    <p className="paragraph-font">Welcome to the Red's Event Recording Application</p>
                    <p className="paragraph-font">To get started, select 'Capture' from the Menu</p>
                </div>
                <div style={{backgroundColor: "lightgrey", marginBottom: "10vw"}}>
                    <h1 style={{alignItems: "center", textAlign: "center"}}>How to Use the App</h1>
                    <p></p>
                </div>


                <div style={{background: "maroon", fontSize: "1.5vw", color: "white", padding: "3vw"}}>
                    <p>Queensland Rugby Union acknowledges the Traditional Owners of the land on which we gather and play</p>
                    <p>We pay our respects to their Elders, past, present, and recognise their ongoing connection to the land, waters, and culture</p>
                    <p>Queensland Ruby Union are committed to promoting reconcilation, respect, and understand 
                        between all Austrailians and strive to create an inclusive and welcoming environment for all. 
                        Through our programs and inititives, we aim to foster reconciliation, promote cultural diversity, and create a sense of belonging
                        for all indivisuals involved in Queensland Rugby Union.</p>
                </div>
            </div>
        </body>
    );
}