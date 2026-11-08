FROM quay.io/keycloak/keycloak:26.2.5

COPY themes/sirepp /opt/keycloak/themes/sirepp

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start"]