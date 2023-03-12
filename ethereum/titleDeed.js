import web3 from "./web3";
import TitleDeed from "./build/TitleDeed.json";

const titleDeedContract = new web3.eth.Contract(
    TitleDeed.abi,
    process.env.NEXT_PUBLIC_TITLE_DEED_ADDRESS
);

export default titleDeedContract;