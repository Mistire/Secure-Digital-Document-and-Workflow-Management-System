
import os
import shutil
import datetime
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.conf import settings

class Command(BaseCommand):
    help = 'Creates a secure backup of the database and media files.'

    def handle(self, *args, **options):
        timestamp = datetime.datetime.now().strftime('%Y-%m-%d_%H-%M-%S')
        backup_root = os.path.join(settings.BASE_DIR, 'backups')
        backup_dir = os.path.join(backup_root, timestamp)
        
        os.makedirs(backup_dir, exist_ok=True)
        self.stdout.write(f"Starting backup to: {backup_dir}")

        db_file = os.path.join(backup_dir, 'db_dump.json')
        try:
            self.stdout.write("Dumping database...")
            with open(db_file, 'w') as f:
                call_command('dumpdata', indent=2, stdout=f)
            self.stdout.write(self.style.SUCCESS(f"Database dumped to {db_file}"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Database dump failed: {e}"))
            return

        media_root = settings.MEDIA_ROOT
        if os.path.exists(media_root):
            self.stdout.write("Archiving media files...")
            archive_name = os.path.join(backup_dir, 'media_archive')
            try:
                shutil.make_archive(archive_name, 'zip', media_root)
                self.stdout.write(self.style.SUCCESS(f"Media archived to {archive_name}.zip"))
            except Exception as e:
                 self.stdout.write(self.style.ERROR(f"Media archive failed: {e}"))
        else:
            self.stdout.write(self.style.WARNING("No media directory found to backup."))

        self.stdout.write(self.style.SUCCESS(f"Backup completed successfully at {backup_dir}"))
