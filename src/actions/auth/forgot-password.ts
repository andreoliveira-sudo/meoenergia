"use server"

import { randomBytes } from "crypto"
import nodemailer from "nodemailer"

import { createAdminClient } from "@/lib/supabase/admin"
import type { ActionResponse } from "@/types/action-response"

function generatePassword(): string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$"
	const bytes = randomBytes(12)
	let password = ""
	for (let i = 0; i < 12; i++) {
		password += chars[bytes[i] % chars.length]
	}
	return password
}

function buildEmailHtml(userName: string, userEmail: string, newPassword: string): string {
	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f6f9;padding:40px 0;">
<tr>
<td align="center">
<table role="presentation" width="560" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

<!-- Header -->
<tr>
<td style="background:linear-gradient(135deg,#0693E3 0%,#0466a8 100%);padding:40px 40px 30px;text-align:center;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td align="center">
<div style="width:64px;height:64px;background-color:rgba(255,255,255,0.2);border-radius:50%;display:inline-block;line-height:64px;margin-bottom:16px;">
<span style="font-size:28px;color:#ffffff;">&#128274;</span>
</div>
</td>
</tr>
<tr>
<td align="center">
<h1 style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">Recuperação de Senha</h1>
<p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,0.85);">MEO Energia - Sistema de Gestão</p>
</td>
</tr>
</table>
</td>
</tr>

<!-- Corpo -->
<tr>
<td style="padding:36px 40px 20px;">
<p style="margin:0 0 8px;font-size:16px;color:#1a1a2e;font-weight:600;">Olá, ${userName}!</p>
<p style="margin:0 0 24px;font-size:14px;color:#4a5568;line-height:1.6;">
Recebemos sua solicitação de recuperação de senha. Uma nova senha foi gerada para sua conta. Utilize as credenciais abaixo para acessar a plataforma:
</p>
</td>
</tr>

<!-- Credenciais -->
<tr>
<td style="padding:0 40px 28px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
<tr>
<td style="padding:24px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0">
<tr>
<td style="padding-bottom:16px;border-bottom:1px solid #e2e8f0;">
<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Email de Acesso</p>
<p style="margin:0;font-size:15px;color:#1a1a2e;font-weight:500;">${userEmail}</p>
</td>
</tr>
<tr>
<td style="padding-top:16px;">
<p style="margin:0 0 4px;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;font-weight:600;">Nova Senha</p>
<table role="presentation" cellspacing="0" cellpadding="0">
<tr>
<td style="background-color:#0693E3;border-radius:8px;padding:10px 20px;">
<span style="font-size:18px;font-weight:700;color:#ffffff;letter-spacing:2px;font-family:'Courier New',monospace;">${newPassword}</span>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>
</table>
</td>
</tr>

<!-- Botão -->
<tr>
<td style="padding:0 40px 28px;" align="center">
<table role="presentation" cellspacing="0" cellpadding="0">
<tr>
<td style="background:linear-gradient(135deg,#0693E3 0%,#0466a8 100%);border-radius:10px;">
<a href="https://dev1.cdxsistemas.com.br/meo" target="_blank" style="display:inline-block;padding:14px 40px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;letter-spacing:0.3px;">
Acessar o Sistema
</a>
</td>
</tr>
</table>
</td>
</tr>

<!-- Aviso -->
<tr>
<td style="padding:0 40px 32px;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fff8f0;border:1px solid #fed7aa;border-radius:10px;">
<tr>
<td style="padding:16px 20px;">
<p style="margin:0;font-size:13px;color:#9a3412;line-height:1.5;">
<strong>&#9888;&#65039; Importante:</strong> Recomendamos que você altere esta senha após o primeiro acesso em <strong>Minha Conta > Alterar Senha</strong>.
</p>
</td>
</tr>
</table>
</td>
</tr>

<!-- Segurança -->
<tr>
<td style="padding:0 40px 28px;">
<p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">
Se você não solicitou a recuperação de senha, por favor ignore este email. Sua senha anterior permanece inalterada apenas se você não utilizou a nova senha acima.
</p>
</td>
</tr>

<!-- Footer -->
<tr>
<td style="background-color:#f8fafc;border-top:1px solid #e2e8f0;padding:24px 40px;text-align:center;">
<p style="margin:0 0 4px;font-size:12px;color:#94a3b8;">Este é um email automático, por favor não responda.</p>
<p style="margin:0;font-size:12px;color:#94a3b8;">© ${new Date().getFullYear()} MEO Energia. Todos os direitos reservados.</p>
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`
}

export async function forgotPassword(email: string): Promise<ActionResponse<null>> {
	if (!email || !email.includes("@")) {
		return { success: false, message: "Informe um email válido." }
	}

	try {
		const adminClient = createAdminClient()

		// 1. Buscar usuário pelo email
		const { data: userData, error: userError } = await adminClient
			.from("users")
			.select("id, name, email")
			.eq("email", email.toLowerCase().trim())
			.single()

		if (userError || !userData) {
			// Não revelar se o email existe ou não (segurança)
			return {
				success: true,
				message: "Se o email estiver cadastrado, uma nova senha será enviada.",
				data: null
			}
		}

		// 2. Gerar nova senha
		const newPassword = generatePassword()

		// 3. Atualizar senha no Supabase Auth
		const { error: authError } = await adminClient.auth.admin.updateUserById(userData.id, {
			password: newPassword
		})

		if (authError) {
			console.error("Erro ao atualizar senha:", authError)
			return { success: false, message: "Erro ao processar a solicitação. Tente novamente." }
		}

		// 4. Enviar email
		const transporter = nodemailer.createTransport({
			host: "mail.meoenergia.com.br",
			port: 465,
			secure: true,
			auth: {
				user: "suporte@meoenergia.com.br",
				pass: "Meo@2026"
			}
		})

		await transporter.sendMail({
			from: '"MEO Energia" <suporte@meoenergia.com.br>',
			to: userData.email,
			subject: "Recuperação de Senha - MEO Energia",
			html: buildEmailHtml(userData.name, userData.email, newPassword)
		})

		return {
			success: true,
			message: "Uma nova senha foi enviada para o seu email.",
			data: null
		}
	} catch (error) {
		console.error("Erro em forgotPassword:", error)
		return {
			success: false,
			message: "Erro ao processar a solicitação. Tente novamente."
		}
	}
}
