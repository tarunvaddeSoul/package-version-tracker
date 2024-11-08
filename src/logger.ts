import chalk from 'chalk';

   enum LogLevel {
     Debug,
     Info,
     Warn,
     Error
   }

   class Logger {
     private static instance: Logger;

     private constructor() {}

     public static getInstance(): Logger {
       if (!Logger.instance) {
         Logger.instance = new Logger();
       }
       return Logger.instance;
     }

     log(level: LogLevel, message: string, ...args: any[]) {
       switch (level) {
         case LogLevel.Debug:
           console.debug(chalk.gray(`[DEBUG] ${message}`), ...args);
           break;
         case LogLevel.Info:
           console.info(chalk.blue(`[INFO] ${message}`), ...args);
           break;
         case LogLevel.Warn:
           console.warn(chalk.yellow(`[WARN] ${message}`), ...args);
           break;
         case LogLevel.Error:
           console.error(chalk.red(`[ERROR] ${message}`), ...args);
           break;
       }
     }
   }

   export { Logger, LogLevel };