import clear from "clear";
import { Home } from "./front/home";
import { checkPassword } from "./modules/util/checkPassword";

const start = async function () {
    await clear();
    await checkPassword();
    await Home();
};

start();