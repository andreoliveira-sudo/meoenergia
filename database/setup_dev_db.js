const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

const DB_CONFIG = {
	host: "177.53.148.179",
	port: 5432,
	user: "codex",
	password: "Ric@7901",
};

const DB_NAME = "meoenergia_dev";

async function run() {
	// Step 1: Recriar o banco de dados
	console.log("=== Conectando ao PostgreSQL ===");
	const adminClient = new Client({ ...DB_CONFIG, database: "postgres" });

	try {
		await adminClient.connect();
		console.log("Conectado com sucesso ao PostgreSQL em " + DB_CONFIG.host);

		// Verificar se o banco já existe
		const res = await adminClient.query(
			"SELECT 1 FROM pg_database WHERE datname = $1",
			[DB_NAME],
		);

		if (res.rows.length > 0) {
			console.log(`Banco '${DB_NAME}' já existe. Removendo para recriar...`);
			// Desconectar sessões ativas
			await adminClient.query(`
				SELECT pg_terminate_backend(pg_stat_activity.pid)
				FROM pg_stat_activity
				WHERE pg_stat_activity.datname = '${DB_NAME}'
				AND pid <> pg_backend_pid()
			`);
			await adminClient.query(`DROP DATABASE ${DB_NAME}`);
			console.log(`Banco '${DB_NAME}' removido.`);
		}

		console.log(`Criando banco '${DB_NAME}'...`);
		await adminClient.query(`CREATE DATABASE ${DB_NAME}`);
		console.log(`Banco '${DB_NAME}' criado com sucesso!`);
	} catch (err) {
		console.error("Erro na etapa 1:", err.message);
		process.exit(1);
	} finally {
		await adminClient.end();
	}

	// Step 2: Executar schema
	console.log("\n=== Executando schema (28 tabelas, 5 enums, indices, funções) ===");
	const dbClient = new Client({ ...DB_CONFIG, database: DB_NAME });

	try {
		await dbClient.connect();
		console.log(`Conectado ao banco '${DB_NAME}'`);

		const schemaSQL = fs.readFileSync(
			path.join(__dirname, "02_create_schema.sql"),
			"utf8",
		);

		await dbClient.query(schemaSQL);
		console.log("Schema criado com sucesso!");
	} catch (err) {
		console.error("Erro no schema:", err.message);
		process.exit(1);
	} finally {
		await dbClient.end();
	}

	// Step 3: Executar seeds
	console.log("\n=== Executando seeds ===");
	const seedClient = new Client({ ...DB_CONFIG, database: DB_NAME });

	try {
		await seedClient.connect();

		const seedSQL = fs.readFileSync(
			path.join(__dirname, "03_seed_data.sql"),
			"utf8",
		);

		await seedClient.query(seedSQL);
		console.log("Seeds inseridos com sucesso!");
	} catch (err) {
		console.error("Erro nos seeds:", err.message);
		process.exit(1);
	} finally {
		await seedClient.end();
	}

	// Step 4: Verificar resultado
	console.log("\n=== Verificação Final ===");
	const verifyClient = new Client({ ...DB_CONFIG, database: DB_NAME });

	try {
		await verifyClient.connect();

		const tables = await verifyClient.query(`
			SELECT table_name
			FROM information_schema.tables
			WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
			ORDER BY table_name
		`);

		console.log(`\nTabelas criadas (${tables.rows.length}/28):`);
		for (const row of tables.rows) {
			const count = await verifyClient.query(
				`SELECT COUNT(*) FROM "${row.table_name}"`,
			);
			console.log(`  ✓ ${row.table_name}: ${count.rows[0].count} registros`);
		}

		const enums = await verifyClient.query(`
			SELECT t.typname, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as values
			FROM pg_type t
			JOIN pg_enum e ON t.oid = e.enumtypid
			GROUP BY t.typname
			ORDER BY t.typname
		`);

		console.log(`\nEnums criados (${enums.rows.length}/5):`);
		for (const row of enums.rows) {
			console.log(`  ✓ ${row.typname}: ${row.values}`);
		}

		const funcs = await verifyClient.query(`
			SELECT routine_name
			FROM information_schema.routines
			WHERE routine_schema = 'public' AND routine_type = 'FUNCTION'
			ORDER BY routine_name
		`);

		console.log(`\nFunções RPC (${funcs.rows.length}/3):`);
		for (const row of funcs.rows) {
			console.log(`  ✓ ${row.routine_name}`);
		}

		const indexes = await verifyClient.query(`
			SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public'
		`);
		console.log(`\nÍndices: ${indexes.rows[0].count}`);

		console.log("\n========================================");
		console.log("  SETUP COMPLETO COM SUCESSO!");
		console.log("========================================");
		console.log(`  Host:     ${DB_CONFIG.host}:${DB_CONFIG.port}`);
		console.log(`  Banco:    ${DB_NAME}`);
		console.log(`  Usuário:  ${DB_CONFIG.user}`);
		console.log("========================================");
	} catch (err) {
		console.error("Erro na verificação:", err.message);
	} finally {
		await verifyClient.end();
	}
}

run().catch(console.error);
