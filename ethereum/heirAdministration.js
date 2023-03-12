import web3 from "./web3";
import HeirsAdministration from "./build/HeirsAdministration.json";

const heirAdministrationContract = new web3.eth.Contract(
    HeirsAdministration.abi,
    process.env.NEXT_PUBLIC_HEIRS_ADMINISTRATION_ADDRESS
);

export default heirAdministrationContract;