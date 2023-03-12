import web3 from "./web3";
import InheritanceFactory from "./build/InheritanceFactory.json";

const inheritanceFactoryContract = new web3.eth.Contract(
    InheritanceFactory.abi,
    process.env.NEXT_PUBLIC_FACTORY_ADDRESS
);

export default inheritanceFactoryContract;