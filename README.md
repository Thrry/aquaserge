# Aquaserge static site

Site statique exportable pour `https://www.aquaserge.com/`.

## Mettre à jour le contenu

La source éditable est `content/site.json`.

- `home` : texte d'accueil et mise en avant.
- `albums` : discographie, liens et pochettes.
- `tourDates` : concerts. Les dates futures et passées sont séparées automatiquement au build.
- `videos` et `photos` : page imagery.
- `contacts` : e-mails et liens professionnels.

Une IA peut modifier ce JSON puis lancer le build, sans toucher aux templates.

## Générer le site

```sh
npm run build
```

La sortie prête à héberger est dans `site-static/`.

## Prévisualiser localement

```sh
npm run preview
```

Puis ouvrir `http://localhost:4173/`.

## Export ZIP

```sh
npm run export
```

Le fichier `aquaserge-site-static.zip` contient uniquement le site statique.
