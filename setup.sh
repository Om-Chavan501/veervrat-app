#! bin/bash

npm install typescript tsx @types/node --save-dev
npm install prisma @types/node @types/pg --save-dev 
npm install @prisma/client @prisma/adapter-pg pg dotenv

npx prisma init --datasource-provider postgresql --output ../generated/prisma
npx prisma migrate dev --name init
npx prisma generate

npx prisma studio --config ./prisma.config.ts    
