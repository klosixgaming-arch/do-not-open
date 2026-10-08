# DO NOT OPEN - Unreal Engine 5 Version

Co-op horror maze game where every door says "DO NOT OPEN" — but one is the exit. Wrong doors release patients that chase you permanently.

## Building the Project

### Prerequisites
- Unreal Engine 5.8 installed via Epic Games Launcher
- Visual Studio 2022 with C++ workload (Windows) or Xcode (Mac)

### Build Steps
1. Open `DoNotOpen.uproject` in Unreal Editor
2. When prompted, click "Generate Visual Studio project files"
3. Open the generated `.sln` file and build in Release mode
4. Return to Unreal Editor and play!

## Project Structure

```
Source/DoNotOpen/
├── DoNotOpen.Build.cs    # Module dependencies
├── DoNotOpen.cpp/h       # Module definition
├── Door.cpp/h            # Door system with randomization
├── Patient.cpp/h         # Enemy AI with chase behavior
├── PlayerCharacter.cpp/h # Player with flashlight/stamina
└── GameMode.cpp/h        # Game flow and door randomization
```

## Core Systems Implemented

- **Door System**: Randomized exit/enemy/supply doors each run (90% enemy rate)
- **Patient AI**: 4-second emergence delay, slow chase speed (30 units/sec), wall collision detection
- **Player Mechanics**: Flashlight with battery drain, stamina-based sprinting
- **Game Flow**: Door opening consequences, patient spawning on wrong door

## Controls (Default UE5 Character)

| Key | Action |
|-----|--------|
| WASD | Move |
| Mouse | Look around |
| E | Open door (when near one) |
| Shift | Sprint (uses stamina) |
| F | Toggle flashlight |

## Multiplayer

The project includes OnlineSubsystem dependencies for future multiplayer implementation. Current version is single-player focused to prove the core loop.

## Assets Needed

This codebase expects you to provide:
- Modular asylum environment assets (walls, floors, ceilings, doors)
- Patient character model and animations
- Props and decorations
- Audio files (background music, door sounds, patient noises)

Import these into your UE5 project and assign them in the Blueprint classes.