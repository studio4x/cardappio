const errorTranslations: Record<string, string> = {
  'New password should be different from the old password.': 'A nova senha deve ser diferente da senha antiga.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'User already registered': 'Este e-mail já está cadastrado.',
  'Invalid login credentials': 'E-mail ou senha inválidos.',
  'Email not confirmed': 'O e-mail ainda não foi confirmado.',
  'Signup requires a valid password': 'O cadastro exige uma senha válida.',
  'Token has expired or is invalid': 'O link expirou ou é inválido. Solicite um novo.',
  'Auth session missing!': 'Sessão de autenticação ausente. Faça login novamente.',
  'Session expired': 'Sessão expirada.',
  'User not found': 'Usuário não encontrado.',
  'Too many requests': 'Muitas requisições. Tente novamente mais tarde.',
  'Unable to validate verification code': 'Código de verificação inválido ou expirado.',
  'Email link is invalid or expired': 'O link do e-mail é inválido ou expirou.',
}

export function translateAuthError(message: string | null | undefined): string {
  if (!message) return 'Erro inesperado. Tente novamente.'
  
  // Exact match
  if (errorTranslations[message]) {
    return errorTranslations[message]
  }

  // Substring match
  const lowerMsg = message.toLowerCase()
  if (lowerMsg.includes('different from the old') || lowerMsg.includes('different from old')) {
    return 'A nova senha deve ser diferente da senha antiga.'
  }
  if (lowerMsg.includes('at least 6 characters')) {
    return 'A senha deve ter pelo menos 6 caracteres.'
  }
  if (lowerMsg.includes('already registered')) {
    return 'Este e-mail já está cadastrado.'
  }
  if (lowerMsg.includes('invalid login credentials')) {
    return 'E-mail ou senha inválidos.'
  }
  if (lowerMsg.includes('not confirmed')) {
    return 'O e-mail ainda não foi confirmado.'
  }
  if (lowerMsg.includes('expired') || lowerMsg.includes('is invalid') || lowerMsg.includes('invalid or expired')) {
    return 'O link expirou ou é inválido. Por favor, solicite um novo.'
  }
  if (lowerMsg.includes('too many requests')) {
    return 'Muitas requisições. Por favor, aguarde e tente novamente.'
  }
  if (lowerMsg.includes('session missing')) {
    return 'Sessão de autenticação ausente. Faça login novamente.'
  }

  return message
}
