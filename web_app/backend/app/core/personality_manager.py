import os
from dataclasses import dataclass
from typing import Literal

import yaml

PersonalitySlug = Literal["aria", "echo", "nexus"]

VALID_SLUGS = {"aria", "echo", "nexus"}


@dataclass
class PersonalityConfig:
    name: str
    slug: str
    wake_word: str
    color: str
    accent: str
    tagline: str
    humor_style: str
    system_prompt: str
    tools_enabled: list[str]
    tools_disabled: list[str]


class PersonalityManager:
    _cache: dict[str, PersonalityConfig] = {}
    _config_dir = os.path.join(os.path.dirname(__file__), "../../personalities")

    @classmethod
    def load(cls, slug: PersonalitySlug) -> PersonalityConfig:
        if slug not in VALID_SLUGS:
            raise ValueError(f"Invalid personality slug: {slug}")

        if slug in cls._cache:
            return cls._cache[slug]

        path = os.path.join(cls._config_dir, f"{slug}.yaml")
        with open(path, "r") as f:
            raw = yaml.safe_load(f)

        config = PersonalityConfig(
            name=raw["name"],
            slug=raw["slug"],
            wake_word=raw["wake_word"],
            color=raw["color"],
            accent=raw["accent"],
            tagline=raw["tagline"],
            humor_style=raw["humor_style"],
            system_prompt=raw["system_prompt"].strip(),
            tools_enabled=raw["tools"]["enabled"],
            tools_disabled=raw["tools"]["disabled"],
        )
        cls._cache[slug] = config
        return config

    @classmethod
    def load_all(cls) -> dict[str, PersonalityConfig]:
        return {slug: cls.load(slug) for slug in VALID_SLUGS}

    @classmethod
    def invalidate_cache(cls):
        cls._cache.clear()
