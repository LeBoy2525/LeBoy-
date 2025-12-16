# Exemple de migration d'une route API

Ce document montre comment migrer une route API du stockage JSON vers PostgreSQL avec Prisma.

## Exemple : Route GET /api/demandes

### ❌ AVANT (Stockage JSON)

```typescript
// app/api/demandes/route.ts
import { NextResponse } from "next/server";
import { demandesStore } from "@/lib/demandesStore";

export async function GET() {
  try {
    const demandes = demandesStore.filter((d) => !d.deletedAt);
    return NextResponse.json({ demandes }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/demandes:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
```

### ✅ APRÈS (PostgreSQL avec Prisma)

```typescript
// app/api/demandes/route.ts
import { NextResponse } from "next/server";
import { getAllDemandes } from "@/repositories/demandesRepo";

export async function GET() {
  try {
    const demandes = await getAllDemandes();
    return NextResponse.json({ demandes }, { status: 200 });
  } catch (error) {
    console.error("Erreur /api/demandes:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
```

## Exemple : Route POST /api/demandes

### ❌ AVANT (Stockage JSON)

```typescript
// app/api/demandes/route.ts
import { NextResponse } from "next/server";
import { createDemande, saveDemandes } from "@/lib/demandesStore";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nouvelleDemande = createDemande(body);
    saveDemandes();
    return NextResponse.json({ demande: nouvelleDemande }, { status: 201 });
  } catch (error) {
    console.error("Erreur /api/demandes POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
```

### ✅ APRÈS (PostgreSQL avec Prisma)

```typescript
// app/api/demandes/route.ts
import { NextResponse } from "next/server";
import { createDemande } from "@/repositories/demandesRepo";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const nouvelleDemande = await createDemande(body);
    return NextResponse.json({ demande: nouvelleDemande }, { status: 201 });
  } catch (error) {
    console.error("Erreur /api/demandes POST:", error);
    return NextResponse.json(
      { error: "Erreur serveur." },
      { status: 500 }
    );
  }
}
```

## Points importants

1. **Toutes les fonctions sont asynchrones** : Utilisez `await` devant les appels aux repositories
2. **Plus besoin de `save*()`** : Prisma sauvegarde automatiquement
3. **Les IDs sont des UUIDs** : Les IDs sont maintenant des strings UUID au lieu de nombres
4. **Les dates sont des objets Date** : Prisma gère automatiquement les conversions

## Migration progressive

Vous pouvez migrer les routes API progressivement :

1. Commencez par les routes GET (lecture seule)
2. Puis les routes POST (création)
3. Enfin les routes PUT/PATCH/DELETE (modification/suppression)

## Vérification

Après chaque migration, testez :

1. ✅ La route fonctionne correctement
2. ✅ Les données sont bien sauvegardées
3. ✅ Les données persistent après un redémarrage
4. ✅ Les relations entre entités fonctionnent

