import { neon } from '@neondatabase/serverless';
const DATABASE_URL= 'postgresql://neondb_owner:npg_FM7Ckyqa9hrf@ep-delicate-hill-adme30zd-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

const sql = neon(DATABASE_URL, {});
 //const sql = neon(`${process.env.DATABASE_URL}`);

export default sql;
