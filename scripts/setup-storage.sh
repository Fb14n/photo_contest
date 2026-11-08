#!/usr/bin/env bash
set -e

if [ "$(id -u)" -ne 0 ]; then
    echo "FEHLER: Dieses Skript muss mit Root-Rechten ausgefuehrt werden (z. B. sudo bash /home/fabian/setup-storage.sh)"
    exit 1
fi

echo "=================================================="
echo " 1. Vergroeßere System-Partition auf SSD (LVM)"
echo "=================================================="
echo "Aktuelle Groesse vor Erweiterung:"
df -h /

# LVM Volume auf die volle Groesse der SSD erweitern
lvextend -l +100%FREE /dev/ubuntu-vg/ubuntu-lv || echo "LVM bereits maximal belegt"
resize2fs /dev/ubuntu-vg/ubuntu-lv || true

echo "Neue Groesse nach Erweiterung:"
df -h /
echo "✓ SSD erfolgreich auf volle Kapazitaet erweitert!"

echo ""
echo "=================================================="
echo " 2. Initialisiere & Formatiere 2-TB-HDD (/dev/sdb)"
echo "=================================================="
if blkid /dev/sdb1 >/dev/null 2>&1; then
    echo "Partition /dev/sdb1 existiert bereits."
else
    echo "Erstelle GPT-Partitionstabelle auf /dev/sdb..."
    parted -s /dev/sdb mklabel gpt
    parted -s -a opt /dev/sdb mkpart primary ext4 0% 100%
    sleep 2
    echo "Formatiere /dev/sdb1 mit ext4..."
    mkfs.ext4 -F -L storage /dev/sdb1
fi

echo ""
echo "=================================================="
echo " 3. Einhaengepunkt /mnt/storage & /etc/fstab"
echo "=================================================="
mkdir -p /mnt/storage
UUID=$(blkid -s UUID -o value /dev/sdb1)
echo "UUID der HDD: $UUID"

if ! grep -q "$UUID" /etc/fstab; then
    echo "Trage /dev/sdb1 in /etc/fstab ein..."
    echo "UUID=$UUID /mnt/storage ext4 defaults,nofail 0 2" >> /etc/fstab
fi

mount -a
echo "✓ /mnt/storage erfolgreich gemountet!"
df -h /mnt/storage

# Berechtigungen fuer Anwendungsbenutzer setzen
APP_USER="${APP_USER:-${SUDO_USER:-$(whoami)}}"
chown -R "$APP_USER:$APP_USER" /mnt/storage
mkdir -p /mnt/storage/photocontest/uploads
mkdir -p /mnt/storage/photocontest/backups

echo ""
echo "=================================================="
echo " 4. Bestehende Uploads synchronisieren"
echo "=================================================="
UPLOADS_SRC="${UPLOADS_SRC:-./data/uploads}"
if [ -d "$UPLOADS_SRC" ]; then
    echo "Kopiere bestehende Fotos auf die HDD..."
    cp -a "$UPLOADS_SRC"/* /mnt/storage/photocontest/uploads/ 2>/dev/null || true
    chown -R "$APP_USER:$APP_USER" /mnt/storage/photocontest/uploads
    echo "✓ Fotos erfolgreich synchronisiert!"
fi

echo ""
echo "=================================================="
echo " SPEICHER-EINRICHTUNG VOLLSTAENDIG ABGESCHLOSSEN!"
echo "=================================================="
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINT,MODEL
