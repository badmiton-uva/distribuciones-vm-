# Tareas programadas

Aquí defines lo que los agentes hacen solos. **Cada línea que empieza por `- ` es una tarea activa.**
Para pausar una tarea, cambia el `- ` del principio por `# ` (o bórrala).

## Formato

```
- cada día a las 09:00: lo que quieres que se haga
- cada lunes a las 09:00: lo que quieres que se haga
```

Días válidos: `día`, `lunes`, `martes`, `miércoles`, `jueves`, `viernes`, `sábado`, `domingo`.
La hora va en formato 24 h (`09:00`, `17:30`).

## Cómo se ejecutan

El servidor (`node server.js`) revisa este archivo cada minuto. Cuando llega la hora, crea una petición nueva en `inbox/` y el capataz la procesa como cualquier otra. El resultado aparece en la web, **pendiente de tu aprobación**.
**Importante:** solo se ejecutan si el servidor está encendido a esa hora. Si se enciende más tarde, se ejecuta una vez la tarea pendiente de ese día, no las atrasadas de días anteriores.

## Tareas activas

- cada día a las 09:00: Haz un resumen de las peticiones pendientes de revisar en results y de las que siguen en inbox, ordenado por urgencia.
- cada lunes a las 09:00: Revisa qué clientes llevan tiempo sin recibir respuesta o seguimiento según las peticiones y resultados anteriores, y prepara borradores de seguimiento.
- cada viernes a las 13:00: Propón tres publicaciones para redes sociales para la semana siguiente, basadas en el catálogo y en la temporada.
