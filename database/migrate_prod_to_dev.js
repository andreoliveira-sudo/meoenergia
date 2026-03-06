const { createClient } = require("@supabase/supabase-js");
const { Client } = require("pg");

// ============================================================
// CONFIGURAÇÃO - PRODUÇÃO (somente LEITURA)
// ============================================================
const SUPABASE_URL = "https://ztadakijxdleljqjslfh.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0YWRha2lqeGRsZWxqcWpzbGZoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUyNzkyMCwiZXhwIjoyMDY2MTAzOTIwfQ.RQZCnMKenxOr3BWmlnq_gPcu3uJqL59Kz3mVc9fgp2M";

// ============================================================
// CONFIGURAÇÃO - DEV (ESCRITA)
// ============================================================
const DEV_DB = {
	host: "177.53.148.179",
	port: 5432,
	database: "meoenergia_dev",
	user: "codex",
	password: "Ric@7901",
};

// Tabelas na ordem correta (respeitando FKs)
const TABLES_ORDER = [
	"users",
	"user_profiles",
	"permissions",
	"role_permissions",
	"user_permissions",
	"user_categories",
	"user_category_members",
	"sellers",
	"partners",
	"partner_users",
	"customers",
	"equipment_brands",
	"equipment_types",
	"equipments",
	"structure_types",
	"orders",
	"order_history",
	"simulations",
	"groups",
	"group_members",
	"group_rules",
	"notifications",
	"notification_templates",
	"notification_logs",
	"api_keys",
	"api_logs",
	"rates",
	"rls_violation_audit",
];

async function fetchFromProd(supabase, tableName) {
	console.log(`  [PROD] Lendo ${tableName}...`);
	const { data, error } = await supabase.from(tableName).select("*");

	if (error) {
		console.log(`  [WARN] Erro ao ler ${tableName}: ${error.message}`);
		return [];
	}

	console.log(`  [PROD] ${tableName}: ${data.length} registros`);
	return data || [];
}

async function insertIntoDev(pgClient, tableName, rows) {
	if (!rows || rows.length === 0) {
		console.log(`  [DEV] ${tableName}: 0 registros (skip)`);
		return 0;
	}

	// Limpar a tabela antes de inserir
	try {
		await pgClient.query(`DELETE FROM "${tableName}"`);
	} catch (e) {
		// Pode falhar por FK, tentar TRUNCATE CASCADE
		try {
			await pgClient.query(`TRUNCATE "${tableName}" CASCADE`);
		} catch (e2) {
			console.log(`  [WARN] Não foi possível limpar ${tableName}: ${e2.message}`);
		}
	}

	const columns = Object.keys(rows[0]);
	const colNames = columns.map((c) => `"${c}"`).join(", ");

	let inserted = 0;

	for (const row of rows) {
		const values = columns.map((c) => {
			const v = row[c];
			if (v === null || v === undefined) return null;
			if (typeof v === "object") return JSON.stringify(v);
			return v;
		});

		const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

		try {
			await pgClient.query(
				`INSERT INTO "${tableName}" (${colNames}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`,
				values,
			);
			inserted++;
		} catch (err) {
			// Log first error only
			if (inserted === 0) {
				console.log(`  [WARN] Erro ao inserir em ${tableName}: ${err.message}`);
				console.log(`  [WARN] Colunas: ${colNames}`);
			}
		}
	}

	console.log(`  [DEV] ${tableName}: ${inserted}/${rows.length} registros inseridos`);
	return inserted;
}

async function run() {
	console.log("============================================================");
	console.log("  MIGRAÇÃO: Supabase PROD -> PostgreSQL DEV");
	console.log("============================================================");
	console.log(`  Prod: ${SUPABASE_URL}`);
	console.log(`  Dev:  ${DEV_DB.host}:${DEV_DB.port}/${DEV_DB.database}`);
	console.log("============================================================\n");

	// Conectar ao Supabase (prod - somente leitura)
	const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: { autoRefreshToken: false, persistSession: false },
	});

	// Conectar ao PostgreSQL (dev - escrita)
	const pgClient = new Client(DEV_DB);
	await pgClient.connect();
	console.log("Conectado ao banco DEV\n");

	// Desabilitar triggers temporariamente para evitar conflitos de FK
	await pgClient.query("SET session_replication_role = 'replica'");

	const summary = [];

	for (const table of TABLES_ORDER) {
		console.log(`\n--- ${table} ---`);
		try {
			const rows = await fetchFromProd(supabase, table);
			const inserted = await insertIntoDev(pgClient, table, rows);
			summary.push({ table, prod: rows.length, dev: inserted });
		} catch (err) {
			console.log(`  [ERROR] ${table}: ${err.message}`);
			summary.push({ table, prod: "?", dev: "ERROR" });
		}
	}

	// Reabilitar triggers
	await pgClient.query("SET session_replication_role = 'origin'");

	// Atualizar sequences do SERIAL (equipments.id)
	try {
		await pgClient.query(`
			SELECT setval('equipments_id_seq', COALESCE((SELECT MAX(id) FROM equipments), 0) + 1, false)
		`);
		console.log("\n[OK] Sequence equipments_id_seq atualizada");
	} catch (e) {
		console.log(`\n[WARN] Sequence: ${e.message}`);
	}

	await pgClient.end();

	// Sumário final
	console.log("\n============================================================");
	console.log("  SUMÁRIO DA MIGRAÇÃO");
	console.log("============================================================");
	console.log("  Tabela                    | Prod  | Dev");
	console.log("  --------------------------+-------+-------");
	for (const s of summary) {
		const name = s.table.padEnd(26);
		const prod = String(s.prod).padStart(5);
		const dev = String(s.dev).padStart(5);
		console.log(`  ${name}| ${prod} | ${dev}`);
	}
	console.log("============================================================");
	console.log("  Migração concluída!");
	console.log("============================================================");
}

run().catch((err) => {
	console.error("ERRO FATAL:", err.message);
	process.exit(1);
});
