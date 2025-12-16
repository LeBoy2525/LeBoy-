# Identifiants Administrateur LeBoy

## Identifiants par défaut

**Email:** `contact@leboy.com`  
**Mot de passe:** `leboy-admin-2025`

## Configuration via variables d'environnement

Vous pouvez configurer les identifiants admin via les variables d'environnement dans `.env.local` :

```env
# Email admin unique
ICD_ADMIN_EMAIL=contact@leboy.com

# Mot de passe admin
ICD_ADMIN_PASSWORD=leboy-admin-2025

# OU plusieurs emails admin (séparés par des virgules)
ICD_ADMIN_EMAILS=contact@leboy.com,admin1@leboy.com,admin2@leboy.com
```

## Notes importantes

- Si `ICD_ADMIN_EMAIL` est défini, il sera utilisé comme email admin principal
- Si `ICD_ADMIN_EMAILS` est défini, tous les emails listés seront reconnus comme admin
- L'email par défaut `contact@leboy.com` est toujours inclus dans la liste des admins
- Le mot de passe par défaut est `leboy-admin-2025` si `ICD_ADMIN_PASSWORD` n'est pas défini

## Dépannage

Si vous ne pouvez pas vous connecter :

1. Vérifiez que vous utilisez le bon email (par défaut : `contact@leboy.com`)
2. Vérifiez que vous utilisez le bon mot de passe (par défaut : `leboy-admin-2025`)
3. Vérifiez les logs du serveur pour voir les messages de débogage `[LOGIN ADMIN]`
4. Vérifiez que les cookies sont bien définis après la connexion
5. Videz le cache du navigateur et les cookies si nécessaire

