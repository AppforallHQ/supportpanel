Installation & Running
========================

As you can guess this is the project that we use to support our users. It
contains some useful tools to help support operators.

Dependencies
-----------------
- [mongodb](http://docs.mongodb.org/manual/tutorial/install-mongodb-on-debian/) (version 2.6.6 or higher)
- [Python](https://wiki.debian.org/Python#Python_in_Debian) (3.4)
- [Virtualenvwrapper](https://virtualenvwrapper.readthedocs.org/)

install them using your lovely package management system (for Debian):

    $ sudo apt-key adv --keyserver keyserver.ubuntu.com --recv 7F0CEB10
    $ echo 'deb http://downloads-distro.mongodb.org/repo/debian-sysvinit dist 10gen' | sudo tee /etc/apt/sources.list.d/mongodb.list
	$ sudo apt-get update
	$ sudo apt-get install -y mongodb-org

You need one of this three repositories in your `Debian` package list to be able to install python 3.4:
- Testing
- Unstable
- Experimental

Now you can install it using:

    $ sudo apt-get update
    $ sudo apt-get install python3.4

And after all we can install `virtualenvwrapper` using:

    $ (sudo) pip install virtualenvwrapper

For more information on how to install this dependencies you can visit links provided above.

Run
-----
It's time to run support panel so use this commands:

    $ mkvirtualenv supportpanel --python=python3.4
    $ cd supportpanel
	$ pip install -r requirements.txt

Now, you're good to go!

    python application.py

You can access API server on `localhost:5000`.
