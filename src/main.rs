//! gild-server — the self-hosted forge backend.
//!
//! Plays the role Cloudflare plays for gild.gg on your own metal: bare git
//! repos on disk, smart-HTTP, the forge API the Next app talks to, sqlite
//! live buffers, the CI queue. Skeleton for now — git smart-HTTP lands first,
//! mined from linkhash's git-facade (demon:~/linkhash-132.yE00bR).
use clap::{Parser, Subcommand};
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "gild-server",
    version,
    about = "The self-hosted gild forge backend"
)]
struct Cli {
    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Set up a forge data directory: bare repos, the claim ledger repo, sqlite.
    Init {
        /// Where the forge keeps its data
        #[arg(long, default_value = ".gild-data")]
        dir: PathBuf,
    },
    /// Serve the forge over HTTP (git smart-HTTP + forge API).
    Serve {
        /// Data directory from `init`
        #[arg(long, default_value = ".gild-data")]
        dir: PathBuf,
        /// Port to listen on
        #[arg(long, default_value_t = 8448)]
        port: u16,
    },
}

fn main() -> std::process::ExitCode {
    let cli = Cli::parse();
    match cli.command {
        Commands::Init { dir } => {
            for sub in ["repos", "ledger"] {
                if let Err(e) = std::fs::create_dir_all(dir.join(sub)) {
                    eprintln!(
                        "gild-server: cannot create {}: {e}",
                        dir.join(sub).display()
                    );
                    return std::process::ExitCode::FAILURE;
                }
            }
            println!("gild server: initialized {}", dir.display());
            println!("  repos/   bare git repositories");
            println!("  ledger/  the claim ledger (a git repo)");
            println!("next: gild-server serve --dir {}", dir.display());
            std::process::ExitCode::SUCCESS
        }
        Commands::Serve { dir, port } => {
            eprintln!(
                "gild-server: serve is not implemented yet (dir={}, port={port})",
                dir.display()
            );
            std::process::ExitCode::FAILURE
        }
    }
}
