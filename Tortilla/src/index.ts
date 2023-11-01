import clear from "clear";
import lockfile from "lockfile";
import { Home } from "./front/menu/home";
import { checkPassword } from "./modules/util/checkPassword";
import os from "os";
import path from "path";
import logger from "./modules/util/logger";

const lockFilePath = path.join(os.homedir(), "/Tortilla/Tortilla.lock");
lockfile.lock(lockFilePath, { retries: 10, retryWait: 1000 }, (err) => {
    if (err) {
        console.error("Another instance is already running.");
        logger.error("Another instance is already running.");
        process.exit(1);
    } else {
        logger.log("Starting application");

        start();

        process.on("exit", () => {
            lockfile.unlock(lockFilePath, (err) => {
                if (err) {
                    console.error("Error releasing lock:", err);
                    logger.error("Error releasing lock");
                } else {
                    console.log("Lock released.");
                    logger.log("Ending application.");
                }
            });
        });
    }
});
const start = async function () {
    await clear();
    await checkPassword();
    await Home();
};
