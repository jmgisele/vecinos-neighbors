# mattrbld

Mattrbld is a headless CMS that stores content in Git. It can be used to manage
content for all types of projects, but it is especially useful for Jamstack
websites. It supports a realtime preview of the content being edited, as well as
support for multi-language content. It is not, however, a complete solution to
build websites, as it only focusses on content, which at the moment can be
stored as JSON or Markdown + YAML frontmatter. You can learn more about the
benefits and current limitations of the project on the [official
website](https://mattrbld.com).

What distinguishes Mattrbld from other similar projects is that it runs as much
on the client-side as possible. It also uses the standard Git protocol instead
of proprietary APIs and thus should work with almost all Git servers and
providers. In fact, there is no backend logic in Mattrbld at all, it’s a static
application itself, meaning that it works fully offline until you need to
synchronise changes back to a central Git repository.

It’s built with Vue.js and uses Isomorphic Git for the Git integration and was
initially developed as part of a BA in communication design at UAS Munich. Due
to those heavy time constraints, the code is not as clean as it should be and
currently there are no automated tests for the time being.

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

## Technical Documentation

There’s a work in progress documentation about all the concepts and functions of
this project which is being managed through Mattrbld itself as a testing ground.
You can find it [here](https://mattrbld.com/docs/).
