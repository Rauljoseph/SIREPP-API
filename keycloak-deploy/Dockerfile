FROM quay.io/keycloak/keycloak:26.2.5

COPY themes/sirepp /opt/keycloak/themes/sirepp
ENV KC_SPI_EVENTS_LISTENER__EMAIL__INCLUDE_EVENTS=user_disabled_by_temporary_lockout

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start"]
