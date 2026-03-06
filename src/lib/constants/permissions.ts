const PERMISSIONS = [
	"admin:dashboard:view",
	"admin:data:manage",
	"admin:data:view",
	"admin:settings:manage",
	"admin:settings:view",
	"admin:users:manage",
	"admin:users:view",
	"admin:permissions:manage",

	"customers:view",

	"partners:manage",
	"partners:view",

	"reports:view",

	"sellers:manage",
	"sellers:view",

	"simulations:create",
	"simulations:view",
	"simulations:rates:manage",

	"orders:view",
	"orders:status",
	"orders:rates:manage"
] as const

export type PermissionId = (typeof PERMISSIONS)[number]

export default PERMISSIONS
