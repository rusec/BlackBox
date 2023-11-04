import clear from "clear";
import lockfile from "lockfile";
import { Home } from "./front/menu/home";
import { checkPassword } from "./modules/util/checkPassword";
import os from "os";
import path from "path";
import logger from "./modules/util/logger";
import SingleInstance from "single-instance";

const locker = new SingleInstance("tortilla");
locker
    .lock()
    .then(() => {
        logger.log("Starting application");

        start();

        process.on("exit", () => {
            logger.log("Ending application.");
        });
    })
    .catch((err: any) => {
        console.error("Another instance is already running.");
        logger.error("Another instance is already running.");
        process.exit(1);
        // This block will be executed if the app is already running
        console.log(err); // it will print out 'An application is already running'
    });

async function start() {
    await clear();
    await checkPassword();
    Home();
}
