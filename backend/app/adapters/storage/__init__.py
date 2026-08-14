"""S3-compatible storage adapters."""

from app.adapters.storage.s3 import S3ObjectStorage, get_object_storage

__all__ = ["S3ObjectStorage", "get_object_storage"]
